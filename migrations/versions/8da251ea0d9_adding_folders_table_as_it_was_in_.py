"""adding folders table as it was in appengine

Revision ID: 8da251ea0d9
Revises: 222b4037be9c
Create Date: 2015-02-18 14:51:34.297872

"""

# revision identifiers, used by Alembic.
revision = '8da251ea0d9'
down_revision = '222b4037be9c'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('folders',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user', sa.String(), nullable=True),
    sa.Column('data', sa.String(), nullable=True),
    sa.Column('__key__', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('folders')
    ### end Alembic commands ###