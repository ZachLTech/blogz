import { getServerSession } from '#auth'

/* 
Body Structure:
{
    blogTitle:
}
*/

type User = {
    name: string,
    email: string,
    id: string
}

export default eventHandler(async event => {
    const body = await readBody(event)
    const session = await getServerSession(event)

    if (!session){
        throw createError({
            statusCode: 401,
            statusMessage: 'You are not authorized to call this API.'
        })
    }

    const userEmail = session.user?.email
    const user = await event.context.prisma.user.findUnique({
        where: {
            email: (userEmail as string | undefined)
        },
        include: {
            blog: true
        }
    })

    if (!user) {
        throw createError({
            statusCode: 422,
            statusMessage: 'Error creating blog, this user doesn\'t exist.'
        })
    } else if (user && user.blog) {
        throw createError({
            statusCode: 422,
            statusMessage: 'Error creating blog, this user already has a blog.'
        })
    }

    const sessionUser: unknown = session.user

    await event.context.prisma.blog.create({
        data: {
            ownerId: (sessionUser as User).id,
            title: body.blogTitle,
        }
    })

})